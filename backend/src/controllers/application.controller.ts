import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { Application, ApplicationStatus } from '../entities/Application';
import { AppError } from '../middleware/error.middleware';
import { User } from '../entities/User';

const applicationRepository = AppDataSource.getRepository(Application);

// Custom interface for Request with user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Create a new application
export const createApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;
    const { amount, purpose, expressDelivery, tip } = req.body;

    // Create the application
    const application = applicationRepository.create({
      userId,
      amount,
      purpose,
      status: ApplicationStatus.PENDING, // Initially set as PENDING
      expressDelivery: expressDelivery || false,
      tip: tip || 0
    });

    await applicationRepository.save(application);

    // For demo purposes - Auto approve the application
    application.status = ApplicationStatus.APPROVED;
    application.approvedAt = new Date();
    application.approvedBy = 'Auto-System';
    
    await applicationRepository.save(application);

    res.status(201).json({
      status: 'success',
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's applications
export const getUserApplications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;

    const applications = await applicationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['transactions'],
    });

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: {
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;
    const { id } = req.params;

    const application = await applicationRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const application = await applicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    if (application.status !== ApplicationStatus.PENDING) {
      return next(new AppError('Application cannot be updated in its current status', 400));
    }

    Object.assign(application, updates);
    await applicationRepository.save(application);

    res.status(200).json({
      status: 'success',
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitDisbursement = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;

    const application = await applicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    if (application.status !== ApplicationStatus.APPROVED) {
      return next(new AppError('Application must be approved before disbursement', 400));
    }

    application.status = ApplicationStatus.DISBURSED;
    application.disbursedAmount = amount;
    application.disbursementDate = new Date();

    await applicationRepository.save(application);

    res.status(200).json({
      status: 'success',
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitRepayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { amount } = req.body;

    const application = await applicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    if (application.status !== ApplicationStatus.DISBURSED) {
      return next(new AppError('Application must be disbursed before repayment', 400));
    }

    application.status = ApplicationStatus.REPAID;
    application.repaidAmount = amount;
    application.repaymentDate = new Date();

    await applicationRepository.save(application);

    res.status(200).json({
      status: 'success',
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;

    const applications = await applicationRepository.find({
      where: { userId },
      order: {
        createdAt: 'DESC',
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        applications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cancel application
export const cancelApplication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const userId = req.user.id;
    const { id } = req.params;

    const application = await applicationRepository.findOne({
      where: { id, userId },
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    if (application.status !== ApplicationStatus.PENDING) {
      return next(new AppError('Only pending applications can be cancelled', 400));
    }

    application.status = ApplicationStatus.CANCELLED;
    await applicationRepository.save(application);

    res.status(200).json({
      status: 'success',
      data: {
        application,
      },
    });
  } catch (error) {
    next(error);
  }
}; 