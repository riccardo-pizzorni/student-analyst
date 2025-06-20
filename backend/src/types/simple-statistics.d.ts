declare module 'simple-statistics' {
  // Funzioni statistiche di base
  export function mean(values: number[]): number;
  export function median(values: number[]): number;
  export function standardDeviation(values: number[]): number;
  export function variance(values: number[]): number;
  export function min(values: number[]): number;
  export function max(values: number[]): number;
  export function sum(values: number[]): number;
  export function product(values: number[]): number;
  
  // Funzioni di correlazione
  export function correlation(x: number[], y: number[]): number;
  export function linearRegression(x: number[], y: number[]): { m: number; b: number };
  
  // Funzioni di distribuzione
  export function quantile(values: number[], q: number): number;
  export function interquartileRange(values: number[]): number;
  
  // Funzioni di utilità
  export function sampleStandardDeviation(values: number[]): number;
  export function sampleVariance(values: number[]): number;
  export function sampleCovariance(x: number[], y: number[]): number;
  
  // Funzioni per array
  export function mode(values: number[]): number[];
  export function modeSorted(values: number[]): number[];
  export function rootMeanSquare(values: number[]): number;
  export function harmonicMean(values: number[]): number;
  export function geometricMean(values: number[]): number;
  
  // Funzioni di ordinamento
  export function quantileSorted(sorted: number[], q: number): number;
  export function medianSorted(sorted: number[]): number;
  
  // Funzioni di clustering
  export function kMeansCluster(data: number[][], k: number): {
    centroids: number[][];
    labels: number[];
  };
  
  // Funzioni di regressione
  export function linearRegressionLine(mb: { m: number; b: number }): (x: number) => number;
  
  // Funzioni di utilità per array
  export function shuffle(array: any[]): any[];
  export function uniqueCountSorted(sorted: any[]): number;
  export function sumNthPowerDeviations(values: number[], n: number): number;
  
  // Funzioni di distribuzione normale
  export function standardNormalTable: { [key: number]: number };
  export function cumulativeStdNormalProbability(z: number): number;
  export function inverseErrorFunction(x: number): number;
  export function probit(p: number): number;
  
  // Funzioni di test statistici
  export function tTest(sample: number[], x: number): number;
  export function tTestTwoSample(sample1: number[], sample2: number[], difference?: number): number;
  
  // Funzioni di utilità per matrici
  export function chiSquaredDistributionTable: { [key: number]: { [key: number]: number } };
  export function chiSquaredGoodnessOfFit(data: number[], distributionFunction: (x: number) => number, significance: number): number;
} 