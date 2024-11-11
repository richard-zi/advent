// backend/routes/webhookRoutes.js
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

const router = express.Router();

// Verifiziere den GitLab Webhook Token
const verifyGitLabWebhook = (req, res, next) => {
  const token = req.headers['x-gitlab-token'];
  
  if (!token || token !== process.env.GITLAB_WEBHOOK_SECRET) {
    logger.error('Ungültiger Webhook Token');
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
  
  next();
};

// Verarbeite den Webhook
router.post('/deploy', verifyGitLabWebhook, (req, res) => {
  const { ref } = req.body;

  // Überprüfe ob der Push auf den main Branch war
  if (ref === 'refs/heads/main') {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'deploy.sh');
    
    // Führe das Deploy-Script aus
    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error('Deployment Fehler:', error);
        return res.status(500).json({ 
          error: 'Deployment fehlgeschlagen',
          details: error.message
        });
      }
      
      logger.info('Deployment erfolgreich:', stdout);
      if (stderr) {
        logger.warn('Deployment Warnungen:', stderr);
      }
      
      res.json({ 
        message: 'Deployment erfolgreich',
        output: stdout
      });
    });
  } else {
    res.json({ message: 'Kein Deployment notwendig (nicht main branch)' });
  }
});

module.exports = router;