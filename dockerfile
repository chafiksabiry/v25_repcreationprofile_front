# Use a lightweight Node.js base image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

ENV VITE_API_URL=https://preprod-api-repcreationwizard.harx.ai/api
ENV VITE_AUTH_API_URL=https://preprod-api-registration.harx.ai/api
ENV VITE_OPENAI_API_KEY=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
ENV VITE_REP_ORCHESTRATOR_URL=/reporchestrator
ENV VITE_REP_ORCHESTRATOR_URL_STANDALONE=https://preprod-rep-orchestrator.harx.ai/
ENV VITE_RUN_MODE=in-app
#ENV VITE_RUN_MODE=standalone
ENV VITE_STANDALONE_USER_ID=681e2d9b4d60b1ff380960f0
#user id for standalone mode 
ENV VITE_STANDALONE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODFlMmQ5YjRkNjBiMWZmMzgwOTYwZjAiLCJpYXQiOjE3NDY4MDgzODB9.aIKpQumOPHJekxzSgDkB1r0ax5BAUE_QErs_chL5-mg
# Install dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the app
RUN npm run build

# Install a lightweight HTTP server to serve the build
RUN npm install -g serve

# Expose the port for the HTTP server
EXPOSE 5174

# Command to serve the app
CMD ["serve", "-s", "dist", "-l", "5174"]