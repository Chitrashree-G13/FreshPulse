/**
 * FreshPulse AI — Complete Decision-First Analysis Pipeline
 * Pure, deterministic orchestration:
 * User input -> Validation -> Metrics -> Risks -> Scoring -> Investigation -> Actions -> Ranking -> Result
 */

import { StoreRecord, ProductRecord, StoreAnalysis, AnalysisInput, AnalysisResult } from '../types';
import { calculateStoreMetrics, calculateNetworkSummary } from './metrics';
import { evaluateStoreRisks } from './riskEngine';
import { calculatePriorityScore } from './scoringEngine';
import {
  generateStoreInvestigation,
  detectMainProblemAndEvidence,
  estimateBusinessImpact,
  deriveFirstAction,
  generateRootCauseAnalysis,
  generateCoreAnswers
} from './investigationEngine';
import { generateStoreActions } from './recommendationEngine';

export function analyzeStore(store: StoreRecord, rank: number = 1, totalStores: number = 1, topStoreRef: { storeId: string; storeName: string; score: number } | null = null): StoreAnalysis {
  const metrics = calculateStoreMetrics(store);
  const risks = evaluateStoreRisks(store, metrics);
  const scoreBreakdown = calculatePriorityScore(store, metrics);
  const investigation = generateStoreInvestigation(store, metrics, risks, scoreBreakdown);
  const actions = generateStoreActions(store, metrics, risks, scoreBreakdown);

  const { mainProblem, primaryEvidence } = detectMainProblemAndEvidence(store, metrics, risks);
  const businessImpact = estimateBusinessImpact(store, metrics, risks);
  const firstAction = deriveFirstAction(store, actions, risks);
  const rootCauseAnalysis = generateRootCauseAnalysis(store, metrics, risks);

  const topStore = topStoreRef || {
    storeId: store.storeId,
    storeName: store.storeName,
    score: scoreBreakdown.totalScore
  };

  const coreAnswers = generateCoreAnswers(
    store,
    metrics,
    risks,
    scoreBreakdown,
    rank,
    totalStores,
    topStore,
    businessImpact,
    firstAction,
    mainProblem,
    primaryEvidence
  );

  let urgencyLevel: StoreAnalysis['urgencyLevel'] = 'Low';
  if (
    scoreBreakdown.totalScore >= 70 ||
    (store.inventoryAvailable === 0 && store.inventorySold > 0 && (store.purchaseOrderStatus === 'Critical Delay' || store.purchaseOrderStatus === 'Delayed'))
  ) {
    urgencyLevel = 'Critical';
  } else if (
    scoreBreakdown.totalScore >= 45 ||
    (store.inventoryAvailable === 0 && store.inventorySold > 0) ||
    store.purchaseOrderStatus === 'Critical Delay'
  ) {
    urgencyLevel = 'High';
  } else if (scoreBreakdown.totalScore >= 25) {
    urgencyLevel = 'Medium';
  }

  const rankExplanation = rank === 1
    ? `Ranked #1 because it has the highest risk score (${scoreBreakdown.totalScore}/100) and strongest evidence of immediate business exposure: ${mainProblem}`
    : `Ranked #${rank} with risk score ${scoreBreakdown.totalScore}/100, trailing Store ${topStore.storeName} (#1, score ${topStore.score}/100). ${scoreBreakdown.totalScore > 0 ? `Key issue: ${mainProblem}` : 'Operations nominal.'}`;

  return {
    store,
    metrics,
    risks,
    priorityScore: scoreBreakdown.totalScore,
    scoreBreakdown,
    investigation,
    actions,
    rank,
    urgencyLevel,
    mainProblem,
    primaryEvidence,
    businessImpact,
    firstAction,
    rankExplanation,
    coreAnswers,
    rootCauseAnalysis
  };
}

export function runFullPipeline(stores: StoreRecord[]): StoreAnalysis[] {
  if (stores.length === 0) return [];

  // 1. Initial pass to compute metrics, risks, scoring, and business impact for all stores
  const rawAnalyses = stores.map(s => {
    const metrics = calculateStoreMetrics(s);
    const risks = evaluateStoreRisks(s, metrics);
    const scoreBreakdown = calculatePriorityScore(s, metrics);
    const businessImpact = estimateBusinessImpact(s, metrics, risks);
    return {
      store: s,
      metrics,
      risks,
      scoreBreakdown,
      businessImpact
    };
  });

  // 2. Rank stores: highest priorityScore first; if tied, highest estimated loss amount first
  rawAnalyses.sort((a, b) => {
    if (b.scoreBreakdown.totalScore !== a.scoreBreakdown.totalScore) {
      return b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
    }
    const lossB = b.businessImpact.estimatedLossAmount || 0;
    const lossA = a.businessImpact.estimatedLossAmount || 0;
    return lossB - lossA;
  });

  const totalStores = rawAnalyses.length;
  const topRaw = rawAnalyses[0];
  const topStoreRef = {
    storeId: topRaw.store.storeId,
    storeName: topRaw.store.storeName,
    score: topRaw.scoreBreakdown.totalScore
  };

  // 3. Generate complete StoreAnalysis with comparative ranking explanations
  const rankedAnalyses: StoreAnalysis[] = rawAnalyses.map((raw, index) => {
    const rank = index + 1;
    const store = raw.store;
    const metrics = raw.metrics;
    const risks = raw.risks;
    const scoreBreakdown = raw.scoreBreakdown;
    const investigation = generateStoreInvestigation(store, metrics, risks, scoreBreakdown);
    const actions = generateStoreActions(store, metrics, risks, scoreBreakdown);

    const { mainProblem, primaryEvidence } = detectMainProblemAndEvidence(store, metrics, risks);
    const businessImpact = raw.businessImpact;
    const firstAction = deriveFirstAction(store, actions, risks);
    const rootCauseAnalysis = generateRootCauseAnalysis(store, metrics, risks);

    let urgencyLevel: StoreAnalysis['urgencyLevel'] = 'Low';
    if (
      scoreBreakdown.totalScore >= 70 ||
      (store.inventoryAvailable === 0 && store.inventorySold > 0 && (store.purchaseOrderStatus === 'Critical Delay' || store.purchaseOrderStatus === 'Delayed'))
    ) {
      urgencyLevel = 'Critical';
    } else if (
      scoreBreakdown.totalScore >= 45 ||
      (store.inventoryAvailable === 0 && store.inventorySold > 0) ||
      store.purchaseOrderStatus === 'Critical Delay'
    ) {
      urgencyLevel = 'High';
    } else if (scoreBreakdown.totalScore >= 25) {
      urgencyLevel = 'Medium';
    }

    let rankExplanation = '';
    if (rank === 1) {
      const runnerUp = rawAnalyses[1];
      rankExplanation = runnerUp
        ? `Ranked #1 (Score: ${scoreBreakdown.totalScore}/100) because it exhibits the most severe compounding business risk: ${mainProblem}. Outranks Store ${runnerUp.store.storeName} (#2, ${runnerUp.scoreBreakdown.totalScore}/100) due to higher immediate loss exposure (${businessImpact.formattedLoss}).`
        : `Ranked #1 (Score: ${scoreBreakdown.totalScore}/100) with strongest evidence of business risk: ${mainProblem} (${businessImpact.formattedLoss} at risk).`;
    } else {
      rankExplanation = `Ranked #${rank} (Score: ${scoreBreakdown.totalScore}/100) below Store ${topStoreRef.storeName} (#1, ${topStoreRef.score}/100) because its buffer and delivery conditions are less critically threatened. ${scoreBreakdown.totalScore > 0 ? `Key finding: ${mainProblem}` : 'Operations nominal.'}`;
    }

    const coreAnswers = generateCoreAnswers(
      store,
      metrics,
      risks,
      scoreBreakdown,
      rank,
      totalStores,
      topStoreRef,
      businessImpact,
      firstAction,
      mainProblem,
      primaryEvidence
    );

    return {
      store,
      metrics,
      risks,
      priorityScore: scoreBreakdown.totalScore,
      scoreBreakdown,
      investigation,
      actions,
      rank,
      urgencyLevel,
      mainProblem,
      primaryEvidence,
      businessImpact,
      firstAction,
      rankExplanation,
      coreAnswers,
      rootCauseAnalysis
    };
  });

  return rankedAnalyses;
}

/**
 * Analysis service contract:
 * Runs the deterministic analysis pipeline asynchronously on user-submitted input.
 */
export async function analyzeAll(input: AnalysisInput): Promise<AnalysisResult> {
  // Slight delay to allow UI to present "Analyzing store data..." feedback
  await new Promise(resolve => setTimeout(resolve, 300));
  const analyses = runFullPipeline(input.stores);
  const networkSummary = calculateNetworkSummary(analyses);

  return {
    analyses,
    networkSummary,
    analyzedAt: new Date().toISOString()
  };
}
