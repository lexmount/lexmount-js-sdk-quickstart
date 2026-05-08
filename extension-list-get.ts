import { access } from 'node:fs/promises';
import { config } from 'dotenv';
import { APIError, Lexmount } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();
  const extensionPath = process.env.LEXMOUNT_EXTENSION_PATH?.trim();
  let uploadedExtensionId: string | undefined;

  try {
    const extensions = await client.extensions.list({ limit: 100 });
    console.log(`Total extensions found: ${extensions.length}`);

    for (const extension of extensions) {
      console.log(`${extension.id} ${extension.name ?? ''}`);
    }

    const first = extensions[0];
    if (first) {
      const details = await client.extensions.get(first.id);
      console.log(`First extension details: ${details.id} ${details.name ?? ''}`);
    }

    if (extensionPath) {
      await access(extensionPath);
      const uploaded = await client.extensions.upload(extensionPath, {
        name: 'quickstart-extension-list-get',
      });
      uploadedExtensionId = uploaded.id;
      console.log(`Uploaded extension: ${uploaded.id}`);

      const details = await client.extensions.get(uploaded.id);
      console.log(`Uploaded extension details: ${details.id} ${details.name ?? ''}`);
    } else {
      console.log('LEXMOUNT_EXTENSION_PATH not set; skipping upload/delete section.');
    }
  } catch (error) {
    if (error instanceof APIError) {
      console.error(`Extension API failed: ${error.message}`);
    }
    throw error;
  } finally {
    if (uploadedExtensionId) {
      await client.extensions.delete(uploadedExtensionId).catch(() => undefined);
    }
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
