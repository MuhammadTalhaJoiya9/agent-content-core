import { body, validationResult } from 'express-validator';

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}

// Auth validation rules
export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('first_name').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('last_name').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  handleValidationErrors
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Project validation rules
export const validateProject = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content_type').isIn(['article', 'social_post', 'video_script', 'email', 'seo_content']),
  body('content').optional().isString(),
  body('status').optional().isIn(['draft', 'in_progress', 'completed']),
  handleValidationErrors
];

// Workspace validation rules
export const validateWorkspace = [
  body('name').trim().isLength({ min: 1 }).withMessage('Workspace name is required'),
  body('plan_type').optional().isIn(['personal', 'team', 'enterprise']),
  handleValidationErrors
];

// Content generation validation rules
export const validateContentGeneration = [
  body('prompt').trim().isLength({ min: 1 }).withMessage('Prompt is required'),
  body('type').optional().isString(),
  body('project_id').optional().isUUID(),
  handleValidationErrors
];