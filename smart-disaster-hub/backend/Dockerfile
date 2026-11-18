FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript using project's TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
