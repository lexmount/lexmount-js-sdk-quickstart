import { config } from 'dotenv';
import { Lexmount, VERSION } from 'lexmount';

config({ override: true });

async function main(): Promise<void> {
  const client = new Lexmount();

  try {
    console.log(`lexmount version: ${VERSION}`);

    const catalog = await client.catalogInfo();
    console.log('\nCatalog info:');
    console.log(JSON.stringify(catalog, null, 2));

    if (catalog.available) {
      console.log('\nRegions:');
      for (const region of catalog.regions) {
        console.log(
          `- ${region.region_id} default=${region.default ?? false} host=${region.host}`
        );
      }
    }
  } finally {
    client.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
