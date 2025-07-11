import { supabase } from './supabase.js';

async function checkRoasters() {
  try {
    console.log('Checking roasters in Supabase...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('account_type', 'roaster')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${data.length} roasters:`);
    data.forEach(roaster => {
      console.log('---');
      console.log('ID:', roaster.id);
      console.log('Name:', roaster.full_name);
      console.log('Username:', roaster.username);
      console.log('Email:', roaster.email);
      console.log('Location:', roaster.location);
      console.log('Account Type:', roaster.account_type);
      console.log('Avatar URL:', roaster.avatar_url);
      console.log('Bio:', roaster.bio);
      console.log('Rating:', roaster.rating);
    });
    
    // Check specifically for Nomad
    const nomad = data.find(r => 
      r.full_name?.toLowerCase().includes('nomad') || 
      r.username?.toLowerCase().includes('nomad')
    );
    
    if (nomad) {
      console.log('\n✅ Nomad Coffee Roasters found:');
      console.log('Full data:', JSON.stringify(nomad, null, 2));
    } else {
      console.log('\n❌ Nomad Coffee Roasters not found');
    }
    
  } catch (error) {
    console.error('Error checking roasters:', error);
  }
}

checkRoasters(); 