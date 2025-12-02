const Plan = require('../models/Plan');

class PersonalizationEngine {
  /**
   * Recommend insurance plan based on user profile and premium
   */
  static async recommendPlan(user, premium) {
    try {
      // Rule-based recommendations
      let recommendedPlan = null;

      if (premium < 100) {
        // Low premium → Basic health coverage
        recommendedPlan = await Plan.query()
          .where('coverage_type', 'basic')
          .where('active', true)
          .first();
      } else if (premium >= 100 && premium < 300) {
        // Medium premium → Standard coverage
        recommendedPlan = await Plan.query()
          .where('coverage_type', 'standard')
          .where('active', true)
          .first();
      } else {
        // High premium → Comprehensive coverage
        recommendedPlan = await Plan.query()
          .where('coverage_type', 'comprehensive')
          .where('active', true)
          .first();
      }

      return {
        plan: recommendedPlan,
        premium: premium,
        estimatedCoverage: this.calculateCoverage(premium, recommendedPlan)
      };
    } catch (error) {
      console.error('Plan recommendation error:', error);
      throw error;
    }
  }

  /**
   * Calculate insurance coverage based on premium and multiplier
   */
  static calculateCoverage(premium, plan, customMultiplier = null) {
    const multiplier = customMultiplier || (plan?.coverage_multiplier || 500);
    const coverage = premium * multiplier;
    
    // Cap at plan's maximum coverage
    const maxCoverage = plan?.max_coverage || 500000;
    return Math.min(coverage, maxCoverage);
  }

  /**
   * Score user risk profile (simple rule-based approach)
   * Returns: 'low', 'medium', 'high'
   */
  static scoreUserRisk(user) {
    let riskScore = 0;

    // Occupation risk factor
    const highRiskOccupations = ['construction', 'mining', 'manufacturing'];
    if (highRiskOccupations.includes(user.occupation?.toLowerCase())) {
      riskScore += 2;
    } else if (['office', 'tech', 'education'].includes(user.occupation?.toLowerCase())) {
      riskScore -= 1;
    }

    // Income level impact
    if (user.income_range === 'low') {
      riskScore += 1;
    } else if (user.income_range === 'high') {
      riskScore -= 1;
    }

    // Determine risk category
    if (riskScore >= 2) return 'high';
    if (riskScore <= -1) return 'low';
    return 'medium';
  }

  /**
   * Calculate premium adjustment based on risk profile
   */
  static adjustPremiumByRisk(basePremium, riskProfile) {
    const adjustments = {
      'low': 0.85,      // 15% discount
      'medium': 1.00,   // No adjustment
      'high': 1.25      // 25% surcharge
    };

    const multiplier = adjustments[riskProfile] || 1.00;
    return Math.round(basePremium * multiplier);
  }

  /**
   * Get personalized plan recommendations (includes ML-ready structure)
   */
  static async getPersonalizedRecommendations(user, premium) {
    try {
      // Calculate risk profile
      const riskProfile = this.scoreUserRisk(user);

      // Adjust premium based on risk
      const adjustedPremium = this.adjustPremiumByRisk(premium, riskProfile);

      // Get plan recommendation
      const recommendation = await this.recommendPlan(user, adjustedPremium);

      return {
        originalPremium: premium,
        adjustedPremium: adjustedPremium,
        riskProfile: riskProfile,
        recommendedPlan: recommendation.plan,
        estimatedCoverage: recommendation.estimatedCoverage,
        message: this.generateRecommendationMessage(recommendation.plan, adjustedPremium, riskProfile)
      };
    } catch (error) {
      console.error('Personalization error:', error);
      throw error;
    }
  }

  /**
   * Generate human-readable recommendation message
   */
  static generateRecommendationMessage(plan, premium, riskProfile) {
    const coverage = this.calculateCoverage(premium, plan);
    
    let message = `Based on your profile, we recommend ${plan.name}. `;
    message += `At KES ${premium}/month, you'll get KES ${Math.round(coverage)} coverage. `;
    
    if (riskProfile === 'high') {
      message += 'Premium adjusted for your risk profile.';
    } else if (riskProfile === 'low') {
      message += 'You qualify for our lower premium rate!';
    }
    
    return message;
  }

  /**
   * Suggest plan upgrade based on usage
   */
  static suggestUpgrade(user, currentPolicy) {
    try {
      // If user has had many claims or is using benefits frequently,
      // suggest upgrading to a higher tier plan
      
      const currentCoverageType = currentPolicy.plan.coverage_type;
      
      if (currentCoverageType === 'basic') {
        return {
          suggestion: 'Upgrade to Standard Health for hospitalization coverage',
          nextPlan: 'standard'
        };
      } else if (currentCoverageType === 'standard') {
        return {
          suggestion: 'Upgrade to Comprehensive for dental and vision coverage',
          nextPlan: 'comprehensive'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Upgrade suggestion error:', error);
      return null;
    }
  }
}

module.exports = PersonalizationEngine;
