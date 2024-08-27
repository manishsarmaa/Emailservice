// class EmailService {
//     constructor() {
//       this.providerIndex = 0;  // Assuming you have multiple providers
//     }
  
//     async sendEmail(email) {
//       // Implement your email sending logic here
//       console.log(`Sending email to ${email.to}`);
//     }
//   }
  
//   module.exports = EmailService;
  

// const axios = require('axios');

// class EmailService {
//   constructor() {
//     this.primaryProvider = this.mockEmailProvider1;
//     this.secondaryProvider = this.mockEmailProvider2;
//     this.maxRetries = 3;
//     this.rateLimit = 5; // Maximum 5 emails per minute
//     this.sentEmails = new Set(); // To ensure idempotency
//     this.status = {};
//     this.queue = [];
//   }

//   // Mock Email Providers
//   async mockEmailProvider1(email) {
//     // Simulate random failure
//     if (Math.random() < 0.5) throw new Error('Primary provider failed');
//     return { success: true, provider: 'Provider1' };
//   }

//   async mockEmailProvider2(email) {
//     // Simulate random failure
//     if (Math.random() < 0.5) throw new Error('Secondary provider failed');
//     return { success: true, provider: 'Provider2' };
//   }

//   // Exponential Backoff Logic
//   async sendWithRetry(email, provider, retries = 0) {
//     try {
//       const response = await provider(email);
//       this.status[email.id] = response;
//       return response;
//     } catch (error) {
//       if (retries < this.maxRetries) {
//         const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff
//         console.log(`Retrying in ${backoffTime}ms...`);
//         await new Promise((resolve) => setTimeout(resolve, backoffTime));
//         return this.sendWithRetry(email, provider, retries + 1);
//       } else {
//         throw new Error('Max retries reached');
//       }
//     }
//   }

//   // Rate Limiting Logic
//   async sendEmail(email) {
//     if (this.sentEmails.has(email.id)) {
//       console.log('Duplicate email, skipping...');
//       return { status: 'Duplicate', email };
//     }

//     if (this.queue.length >= this.rateLimit) {
//       console.log('Rate limit reached, adding to queue...');
//       this.queue.push(email);
//       return { status: 'Queued', email };
//     }

//     this.sentEmails.add(email.id);

//     try {
//       const response = await this.sendWithRetry(email, this.primaryProvider);
//       return response;
//     } catch (error) {
//       console.log('Primary provider failed, switching to secondary...');
//       try {
//         const response = await this.sendWithRetry(email, this.secondaryProvider);
//         return response;
//       } catch (secondaryError) {
//         this.status[email.id] = { success: false, error: secondaryError.message };
//         throw new Error('Both providers failed');
//       }
//     }
//   }

//   // Process Queue
//   processQueue() {
//     while (this.queue.length > 0) {
//       const email = this.queue.shift();
//       this.sendEmail(email);
//     }
//   }
// }

// module.exports = EmailService;

const axios = require('axios');

// Mock providers with sample endpoints
const providers = [
  { name: 'Provider1', endpoint: 'https://provider1.com/send' },
  { name: 'Provider2', endpoint: 'https://provider2.com/send' }
];

// Configurations
const RETRY_LIMIT = 3;
const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 16000; // 16 seconds
const RATE_LIMIT = 5; // Max requests per minute

class EmailService {
  constructor() {
    this.providerIndex = 0; // Start with the first provider
    this.sentEmails = new Set(); // For idempotency
    this.emailQueue = [];
    this.isProcessing = false;
    this.failedAttempts = {};
  }

  // Utility function to simulate network request
  async sendRequest(provider, email) {
    // Simulate network request with axios
    return axios.post(provider.endpoint, email);
  }

  // Retry logic with exponential backoff
  async retrySendEmail(provider, email, attempt = 1) {
    try {
      await this.sendRequest(provider, email);
      console.log(`Email sent successfully via ${provider.name}`);
      return true;
    } catch (error) {
      if (attempt >= RETRY_LIMIT) {
        console.error(`Failed to send email after ${RETRY_LIMIT} attempts via ${provider.name}`);
        throw error;
      }
      const backoff = Math.min(INITIAL_BACKOFF * 2 ** (attempt - 1), MAX_BACKOFF);
      console.log(`Retrying in ${backoff / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return this.retrySendEmail(provider, email, attempt + 1);
    }
  }

  // Send email with fallback and retry logic
  async sendEmail(email) {
    if (this.sentEmails.has(email.id)) {
      console.log('Duplicate email detected, skipping.');
      return { status: 'skipped' };
    }
    
    this.sentEmails.add(email.id);
    this.emailQueue.push(email);

    if (!this.isProcessing) {
      this.isProcessing = true;
      await this.processQueue();
      this.isProcessing = false;
    }
    
    return { status: 'queued' };
  }

  async processQueue() {
    while (this.emailQueue.length > 0) {
      const email = this.emailQueue.shift();
      let success = false;

      for (let i = 0; i < providers.length; i++) {
        const provider = providers[this.providerIndex];
        this.providerIndex = (this.providerIndex + 1) % providers.length;

        try {
          success = await this.retrySendEmail(provider, email);
          if (success) break;
        } catch (error) {
          console.error(`Error with ${provider.name}: ${error.message}`);
        }
      }

      if (!success) {
        console.error(`Failed to send email to ${email.to} after all providers.`);
      }
    }
  }
}

module.exports = EmailService;
