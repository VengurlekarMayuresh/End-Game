const { PrismaClient } = require('@prisma/client');
const regions = [
  'ap-south-1',
  'us-east-1',
  'ap-southeast-1',
  'eu-central-1',
  'us-west-1',
  'eu-west-1',
  'eu-west-2'
];

async function testRegions() {
  for (const region of regions) {
    const url = `postgresql://postgres.indsbjwrqdnknmzzhrib:Mayuresh%409321@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
    console.log(`Testing region: ${region}`);
    
    const prisma = new PrismaClient({
      datasources: { db: { url } },
    });
    
    try {
      // Just try to run a simple query
      await prisma.user.findFirst();
      console.log(`\n\n✅ SUCCESS! The correct region is: ${region}`);
      await prisma.$disconnect();
      return region;
    } catch (error) {
      console.log(`❌ Failed for ${region}: ${error.message.split('\n')[0]}`);
      await prisma.$disconnect();
    }
  }
  console.log('Could not find the correct region.');
  return null;
}

testRegions();
