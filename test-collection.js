import { supabase, saveToCollection } from './src/lib/supabase.js';

async function testCollection() {
  try {
    console.log('Testing collection functionality...');
    
    // First, let's check if we can get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }
    
    if (!user) {
      console.log('No user found - authentication required');
      return;
    }
    
    console.log('Current user:', user.id);
    
    // Test coffee object
    const testCoffee = {
      id: 'test-coffee-123',
      name: 'Test Coffee',
      roaster: 'Test Roaster',
      origin: 'Test Origin',
      process: 'Washed',
      roastLevel: 'Medium',
      description: 'A test coffee for debugging',
      price: 20.50,
      image: 'https://example.com/test-coffee.jpg'
    };
    
    console.log('Testing saveToCollection with coffee:', testCoffee);
    
    // Try to save to collection
    const result = await saveToCollection(testCoffee);
    console.log('saveToCollection result:', result);
    
  } catch (error) {
    console.error('Test error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testCollection(); 