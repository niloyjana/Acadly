const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const bucketName = 'acadly-submissions';

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const exists = buckets.some(b => b.name === bucketName);

  if (!exists) {
    console.log(`Bucket '${bucketName}' does not exist. Creating it now...`);
    // Create a private bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: false, // Private bucket so files require signed URLs (which we already built!)
    });

    if (error) {
      console.error("Failed to create bucket:", error);
    } else {
      console.log(`Successfully created private bucket: ${bucketName}`);
    }
  } else {
    console.log(`Bucket '${bucketName}' already exists!`);
  }
}

main();
