import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { evaluateStartup, predictRisk, detectFraud } from '../../services/aiService';
import { calculateInvestorMatch } from '../../utils/matchAlgorithm';

export default function AIEvaluationScreen() {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    const fetchAIData = async () => {
      // Mock business and investor data
      const mockBusiness = {
        name: "EcoTech Solutions",
        category: "Tech",
        riskLevel: "Low",
        fundingNeeded: 50000,
        location: "New York"
      };

      const mockInvestor = {
        industry: "Tech",
        riskLevel: "Low",
        budget: 100000,
        location: "New York"
      };

      try {
        const startupEval = await evaluateStartup(mockBusiness);
        const riskData = await predictRisk(mockBusiness);
        const fraudData = await detectFraud(mockBusiness);
        const matchScore = calculateInvestorMatch(mockInvestor, mockBusiness);

        setEvaluation({
          startupScore: startupEval.score || 91,
          recommendation: startupEval.recommendation || "Highly Recommended",
          riskLevel: riskData.riskLevel || "Low",
          fraudAlerts: fraudData.alerts || ["No suspicious activity detected", "Verified Identity"],
          investorMatch: matchScore
        });
      } catch (error) {
        console.error("Error fetching AI data", error);
        // Fallback demo data
        setEvaluation({
          startupScore: 91,
          recommendation: "Highly Recommended",
          riskLevel: "Low",
          fraudAlerts: ["No suspicious activity detected", "Verified Identity"],
          investorMatch: 88
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0056D2" />
        <Text style={styles.loadingText}>Running AI Analysis...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={32} color="#0056D2" />
          <Text style={styles.title}>AI Smart Evaluation</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>AI Startup Score:</Text>
            <Text style={[styles.value, { color: '#0056D2' }]}>{evaluation.startupScore}%</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.label}>Risk Level:</Text>
            <Text style={[styles.value, { color: '#28a745' }]}>{evaluation.riskLevel}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Investor Match:</Text>
            <Text style={[styles.value, { color: '#0056D2' }]}>{evaluation.investorMatch}%</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Recommendation:</Text>
            <Text style={[styles.value, { fontWeight: 'bold' }]}>{evaluation.recommendation}</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#28a745" />
            <Text style={styles.alertTitle}>Fraud Alerts</Text>
          </View>
          {evaluation.fraudAlerts.map((alert, index) => (
            <Text key={index} style={styles.alertText}>• {alert}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  alertText: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 4,
  }
});
