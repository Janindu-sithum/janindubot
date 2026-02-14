# Node version එක 20 දක්වා වැඩි කළා
FROM node:20-slim

# Install git and canvas dependencies for Linux
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Start the bot
CMD ["node", "index.js"]
