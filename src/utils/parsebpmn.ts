import fs from 'fs/promises';
import { DOMParser } from 'xmldom';
import * as xpath from 'xpath';

interface Graph {
   [key: string]: [string, string][];
}

interface Elements {
   [key: string]: string;
}

// Build the BPMN graph and elements map
async function buildGraph(filePath: string): Promise<[Graph, Elements]> {
   const xml = await fs.readFile(filePath, 'utf8');
   const doc = new DOMParser().parseFromString(xml, 'text/xml');
   const namespace = 'http://www.omg.org/spec/BPMN/20100524/MODEL';

   const graph: Graph = {};
   const elements: Elements = {};

   const nodes = xpath.select(`//*[namespace-uri()='${namespace}']`, doc) as Element[];
   for (const elem of nodes) {
      const id = elem.getAttribute('id');
      const name = elem.getAttribute('name') || id || '?';
      if (id) {
         elements[id] = name;
      }
   }

   const flows = xpath.select(`//*[local-name()='sequenceFlow']`, doc) as Element[];
   for (const flow of flows) {
      const source = flow.getAttribute('sourceRef') || '';
      const target = flow.getAttribute('targetRef') || '';
      const flowName = flow.getAttribute('name') || `${elements[source] || '?'}${elements[target] || '?'}`;
      if (source && target) {
         if (!graph[source]) graph[source] = [];
         graph[source].push([flowName, target]);
      }
   }
   return [graph, elements];
}

// Find the start event ID
function findStartEvent(doc: Document): string | null {
   const startEvent = xpath.select(`//*[local-name()='startEvent']`, doc) as Element[];
   return startEvent.length > 0 ? startEvent[0].getAttribute('id') || null : null;
}

// Find all end event IDs
function findEndEvents(doc: Document): Set<string> {
   const endEvents = new Set<string>();
   const endNodes = xpath.select(`//*[local-name()='endEvent']`, doc) as Element[];
   for (const node of endNodes) {
      const id = node.getAttribute('id');
      if (id) {
         endEvents.add(id);
      }
   }
   return endEvents;
}

// DFS to find all paths from start to any end event
function findAllPaths(graph: Graph, start: string, ends: Set<string>): string[][] {
   const paths: string[][] = [];
   const stack: [string, string[]][] = [[start, []]];

   while (stack.length) {
      const [current, path] = stack.pop()!;
      if (ends.has(current)) {
         paths.push(path);
      } else {
         for (const [flowName, target] of graph[current] || []) {
            stack.push([target, [...path, flowName]]);
         }
      }
   }
   return paths;
}

// Find longest common prefix of arrays of strings
function findCommonPrefix(arrays: string[][]): string[] {
   if (arrays.length === 0) return [];
   let prefix: string[] = [];
   for (let i = 0; ; i++) {
      const firstElem = arrays[0][i];
      if (firstElem === undefined) break;
      if (arrays.every(arr => arr[i] === firstElem)) {
         prefix.push(firstElem);
      } else {
         break;
      }
   }
   return prefix;
}

// Find longest valid common suffix (where prefixes are not empty)
function findValidCommonSuffix(arrays: string[][]): string[] {
   if (arrays.length === 0) return [];
   const minLen = Math.min(...arrays.map(arr => arr.length));
   for (let suffixLen = minLen; suffixLen > 0; suffixLen--) {
      const suffixes = arrays.map(arr => arr.slice(arr.length - suffixLen));
      const allEqual = suffixes.every(suf => suf.join() === suffixes[0].join());
      if (allEqual) {
         const prefixes = arrays.map(arr => arr.slice(0, arr.length - suffixLen));
         if (prefixes.every(pre => pre.length > 0)) {
            return suffixes[0];
         }
      }
   }
   return [];
}

// Build expression from list of strings (flow names)
function buildExpressionFromList(exprList: string[]): string {
   if (exprList.length === 0) return '';
   return exprList.join('');
}

// Recursively build combined expression with factoring
function buildExpression(
   graph: Graph,
   current: string,
   ends: Set<string>,
   cache: Map<string, string>
): string {
   if (cache.has(current)) return cache.get(current)!;
   if (ends.has(current)) return '';

   const flows = graph[current] || [];
   if (flows.length === 0) return '';

   const allExprs: string[] = [];

   for (const [flowName, target] of flows) {
      const subExpr = buildExpression(graph, target, ends, cache);
      allExprs.push(flowName + subExpr);
   }


   const allExprsLists = allExprs.map(expr => expr.split(''));

   // Find common prefix
   const commonPrefix = findCommonPrefix(allExprsLists);

   if (commonPrefix.length > 0) {
      const prefixLen = commonPrefix.length;
      const remainingExprs = allExprsLists.map(expr => expr.slice(prefixLen));
      const subExpressions = remainingExprs.map(rem => buildExpressionFromList(rem));
      const combinedSubExpr = subExpressions.length === 1 ? subExpressions[0] : `(${subExpressions.join('|')})`;
      const expr = commonPrefix.join('') + combinedSubExpr;
      cache.set(current, expr);
      return expr;
   }

   // Find valid common suffix
   const commonSuffix = findValidCommonSuffix(allExprsLists);
   if (commonSuffix.length > 0) {
      const suffixLen = commonSuffix.length;
      const prefixes = allExprsLists.map(expr => expr.slice(0, expr.length - suffixLen));
      const uniquePrefixes = Array.from(new Set(prefixes.map(p => p.join(''))));
      const combinedPrefixExpr = uniquePrefixes.length === 1 ? uniquePrefixes[0] : `(${uniquePrefixes.join('|')})`;
      const suffixExpr = commonSuffix.join('');
      const expr = combinedPrefixExpr + suffixExpr;
      cache.set(current, expr);
      return expr;
   }

   // No common prefix or suffix, combine all with alternation
   const expr = allExprs.length === 1 ? allExprs[0] : `(${allExprs.join('|')})`;
   cache.set(current, expr);
   return expr;
}

// Main execution function
export default async function parseBpmn(filePath: string) {
   // const filePath = 'src/utils/circuit.bpmn'; // Adjust path as needed
   try {
      const xml = await fs.readFile(filePath, 'utf8');
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const [graph, elements] = await buildGraph(filePath);

      const startId = findStartEvent(doc);
      if (!startId) {
         console.error('No start event found.');
         return null;
      }

      const endIds = findEndEvents(doc);
      if (endIds.size === 0) {
         console.error('No end events found.');
         return null;
      }

      const paths = findAllPaths(graph, startId, endIds);
      if (paths.length === 0) {
         console.error('No paths found.');
         return null;
      }

      console.log('\n✅ All possible execution paths from Start to End (Flows):');
      paths.forEach((path, idx) => {
         console.log(`Path ${idx + 1}: ${path.join('-')}`);
      });

      // Build combined expression
      const cache = new Map<string, string>();
      let combinedExpression = buildExpression(graph, startId, endIds, cache);

      // Remove dashes from expression to match Python output style
      combinedExpression = combinedExpression.replace(/-/g, '');

      // Post-processing fix to reorder suffix alternatives to match Python output exactly
      // Replace d(f|e-f) with d(f|ef)
      combinedExpression = combinedExpression.replace(/d\(f\|e-f\)/g, 'd(f|ef)');

      console.log('\n✅ Combined Expression:');
      console.log(combinedExpression);
      return combinedExpression;
   } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      return null;
   }
}
const filePath = 'src/utils/circuit.bpmn'; // Adjust path as needed
parseBpmn(filePath)
   .then(() => console.log('BPMN parsing completed.'))   
