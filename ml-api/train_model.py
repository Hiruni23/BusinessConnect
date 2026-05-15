import pandas as pd
from sklearn.tree import DecisionTreeClassifier
import pickle

# Load dataset
df = pd.read_csv('dataset.csv')

# Simple mapping for categorical data
df['industry'] = df['industry'].astype('category').cat.codes
df['riskLevel'] = df['riskLevel'].astype('category').cat.codes
df['location'] = df['location'].astype('category').cat.codes

X = df[['industry', 'riskLevel', 'fundingNeeded', 'location']]
y = df['successRate'] > 75 # Treat >75 as highly successful

model = DecisionTreeClassifier()
model.fit(X, y)

with open('startup_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("Model trained and saved to startup_model.pkl")
