// console.log("Test file started");

// const EmailService = require('./EmailService');
// const emailService = new EmailService();

// async function runTests() {
//   console.log("Running Tests...");
//   const email = { id: '1', to: 'test@example.com', content: 'Hello!' };
//   await emailService.sendEmail(email);
// }

//runTests();


// const EmailService = require('./EmailService');

// const emailService = new EmailService();

// async function runTests() {
//   console.log('Running Tests...');
//   try {
//     const email1 = { id: 'email1', to: 'test1@example.com', content: 'Hello World!' };
//     const response1 = await emailService.sendEmail(email1);
//     console.log('Email 1:', response1);

//     const email2 = { id: 'email2', to: 'test2@example.com', content: 'Hello Again!' };
//     const response2 = await emailService.sendEmail(email2);
//     console.log('Email 2:', response2);

//     // Test idempotency
//     const response3 = await emailService.sendEmail(email1);
//     console.log('Email 3 (duplicate):', response3);
//   } catch (error) {
//     console.error('Test failed:', error);
//   }
// }

// runTests();

const EmailService = require('./EmailService');
const emailService = new EmailService();

async function runTests() {
  console.log('Running Tests...');
  
  const email1 = { id: 'email1', to: 'test1@example.com', content: 'Hello World!' };
  const email2 = { id: 'email2', to: 'test2@example.com', content: 'Hello Again!' };
  
  // Test sending email
  const response1 = await emailService.sendEmail(email1);
  console.log('Email 1 Response:', response1);

  // Test sending the same email (idempotency)
  const response2 = await emailService.sendEmail(email1);
  console.log('Email 1 Response Again:', response2);

  // Test sending another email
  const response3 = await emailService.sendEmail(email2);
  console.log('Email 2 Response:', response3);
  
  // Wait for processing queue
  await new Promise(resolve => setTimeout(resolve, 10000));
}

runTests();
