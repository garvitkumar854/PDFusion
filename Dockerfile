# Use an official Node.js image
FROM node:22

# Install qpdf
RUN apt-get update && apt-get install -y qpdf

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# Expose the port (Render will set $PORT)
EXPOSE 5000

# Start your server
CMD ["npm", "run", "server"] 