const S3 = require('aws-sdk/clients/s3');
const s3 = new S3({
  accessKeyId: process.env.ECA_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.ECA_AWS_SECRET_ACCESS_KEY,
  region: process.env.ECA_AWS_S3_REGION || 'us-west-2',
  params: {
    Bucket: process.env.ECA_AWS_S3_BUCKET_NAME,
  },
});

module.exports = s3;
