import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AppError } from './error.middleware';

// Auth validations
export const validateRegistration = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }
    next();
  },
];

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }
    next();
  },
];

// Application validations
export const validateApplication = [
  body('requestedAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Requested amount must be greater than 0'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }
    next();
  },
];

export const validateDisbursement = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Disbursement amount must be greater than 0'),
  body('isExpressDelivery')
    .optional()
    .isBoolean()
    .withMessage('isExpressDelivery must be a boolean'),
  body('tipAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tip amount must be greater than or equal to 0'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }
    next();
  },
];

export const validateRepayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Repayment amount must be greater than 0'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new AppError(errors.array()[0].msg, 400));
    }
    next();
  },
]; 