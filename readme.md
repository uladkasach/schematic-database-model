# References:
- https://github.com/Microsoft/TypeScript-Node-Starter
- https://blog.shovonhasan.com/deploying-a-typescript-node-aws-lambda-function-with-serverless/

# tugether-service-images

Purpose: convert image ids to image uri's that client servers can resolve.

## Use cases
### Retreival
graphql server will return Image model objects - based on the image_ids that ideas, plans, users, etc return. The image model will need to determine the path to the image it references to before resolving from graphql. This path will point to s3 and will point with different dimensions.

### Uploading
services will need to support the storage of images. user profile pics, history pics, event and idea pics, etc. There needs to be a consistent api through which images can be saved. the client will send graphql image mutations which will contain the base64 images. The graphql layer will create image model objects out of these images and conduct the .save() call.
- the image object will then call this lambda and forward the base64 data to be recorded
  - will the image object place the image in a queue to be processed? large file types...


## Tooling
http://sharp.dimens.io/en/stable/ - image processing
