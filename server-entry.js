require('babel-core/register')({
  'presets': [
    ['env', {
      'targets': {
        'node': true
      }
    }]
  ],
  "plugins": [
    // "typecheck"
  ]
})
require('./app.ts')