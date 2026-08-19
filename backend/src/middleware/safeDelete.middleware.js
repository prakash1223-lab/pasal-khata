'use strict';

const PROTECTED_ROUTES = ['/api/shops'];

const safeDelete = (req, res, next) => {
  if (req.method === 'DELETE') {
    const { path, user } = req;
    console.log(`🗑️  DELETE ATTEMPT  path=${path}  user=${user?.id} (${user?.role})  time=${new Date().toISOString()}`);

    for (const route of PROTECTED_ROUTES) {
      if (path.startsWith(route)) {
        return res.status(403).json({
          success: false,
          message: 'This record is permanently protected and cannot be deleted.',
        });
      }
    }
  }
  next();
};

module.exports = safeDelete;
