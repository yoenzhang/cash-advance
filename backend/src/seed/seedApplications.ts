import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Application, ApplicationStatus } from '../entities/Application';

/**
 * Seeds the database with sample applications for demo purposes
 */
export const seedApplications = async () => {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log('Database connection initialized for seeding applications');

    // Find all users
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find();

    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      return;
    }

    // Get the application repository
    const applicationRepository = AppDataSource.getRepository(Application);

    // Check if applications already exist
    const existingCount = await applicationRepository.count();
    if (existingCount > 0) {
      console.log(`${existingCount} applications already exist. Skipping seed.`);
      return;
    }

    // Sample applications for each user
    const sampleApplications = [];

    for (const user of users) {
      // Pending application
      sampleApplications.push(applicationRepository.create({
        userId: user.id,
        amount: 500.00,
        purpose: 'Emergency car repair',
        status: ApplicationStatus.PENDING,
        expressDelivery: false,
        tip: 0
      }));

      // Approved application
      sampleApplications.push(applicationRepository.create({
        userId: user.id,
        amount: 750.00,
        purpose: 'Medical expenses',
        status: ApplicationStatus.APPROVED,
        expressDelivery: true,
        tip: 15.00,
        approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        approvedBy: 'System Admin'
      }));

      // Disbursed application
      sampleApplications.push(applicationRepository.create({
        userId: user.id,
        amount: 1000.00,
        purpose: 'Rent payment',
        status: ApplicationStatus.DISBURSED,
        expressDelivery: false,
        tip: 20.00,
        approvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        approvedBy: 'System Admin',
        disbursedAmount: 1000.00,
        disbursementDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) // 9 days ago
      }));

      // Repaid application
      sampleApplications.push(applicationRepository.create({
        userId: user.id,
        amount: 300.00,
        purpose: 'Utility bills',
        status: ApplicationStatus.REPAID,
        expressDelivery: false,
        tip: 5.00,
        approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        approvedBy: 'System Admin',
        disbursedAmount: 300.00,
        disbursementDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000), // 29 days ago
        repaidAmount: 300.00,
        repaymentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      }));

      // Cancelled application
      sampleApplications.push(applicationRepository.create({
        userId: user.id,
        amount: 250.00,
        purpose: 'Travel expenses',
        status: ApplicationStatus.CANCELLED,
        expressDelivery: false,
        tip: 0
      }));
    }

    // Save all the sample applications
    await applicationRepository.save(sampleApplications);

    console.log(`Created ${sampleApplications.length} sample applications`);
  } catch (error) {
    console.error('Error seeding applications:', error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
};

// Execute the seed function if this file is run directly
if (require.main === module) {
  seedApplications().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Seed error:', error);
    process.exit(1);
  });
} 