const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const AWS = require('aws-sdk');

try {
  const functionName = core.getInput('function-name');
  const package = core.getInput('package');
  const AWS_SECRET_KEY = core.getInput('AWS_SECRET_KEY');
  const AWS_SECRET_ID = core.getInput('AWS_SECRET_ID');
  const AWS_REGION = core.getInput('AWS_REGION');
  const environment = core.getInput('environment');

  console.log(`Deploying ${functionName} from ${package}.`);

  var zipBuffer = fs.readFileSync(`./${package}`);
  core.debug('ZIP file put into memory buffer.');

  const lambda = new AWS.Lambda({
      apiVersion: '2015-03-31',
      region: AWS_REGION,
      secretAccessKey: AWS_SECRET_KEY,
      accessKeyId: AWS_SECRET_ID,
      maxRetries: 3,
      sslEnabled: true,
      logger: console
  });

  var params = {
    FunctionName: functionName
  };
  lambda.getFunction(params, function(err, data) {
    if (err) {
      var params = {
        Code: {
          ZipFile: zipBuffer
        },
        FunctionName: functionName,
        Role: 'getCardType-role',
        Publish: true,
        Runtime: 'nodejs14.x',
        Environment: {
          Variables: {
            'env_name': environment
          }
        },
        Tags: {
          'Environment': environment.charAt(0).toUpperCase()+environment.slice(1)
        }
      }
      lambda.createFunction(params, err => {
          if (err) {
              console.error(err);
              core.setFailed(err)
          }
      });
    } else {
      const params = {
        FunctionName: functionName,
        Publish: true,
        ZipFile: zipBuffer
      };

      lambda.updateFunctionCode(params, err => {
          if (err) {
              console.error(err);
              core.setFailed(err)
          }
      });
    }
  });

} catch (error) {
  core.setFailed(error.message);
}
