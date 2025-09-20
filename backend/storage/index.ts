import { Bucket } from "encore.dev/storage/objects";

// Bucket for storing issue images
export const issueImages = new Bucket("issue-images", {
  public: true,
});
