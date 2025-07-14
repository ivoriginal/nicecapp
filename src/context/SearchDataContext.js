import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Create the context
const SearchDataContext = createContext({
  popularCoffees: [],
  goodCafes: [],
  popularGear: [],
  suggestedUsers: [],
  popularRecipes: [],
  isSearchDataLoaded: false,
  isLoading: false,
  loadSearchData: () => {},
  refreshSearchData: () => {},
});

export const SearchDataProvider = ({ children }) => {
  const [popularCoffees, setPopularCoffees] = useState([]);
  const [goodCafes, setGoodCafes] = useState([]);
  const [popularGear, setPopularGear] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [isSearchDataLoaded, setIsSearchDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadSearchData = useCallback(async () => {
    if (isLoading || isSearchDataLoaded) return;
    
    setIsLoading(true);
    console.log('SearchDataContext: Loading search data...');
    
    try {
      // Load popular coffees
      const { data: coffees, error: coffeesError } = await supabase
        .from('coffees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (coffeesError) throw coffeesError;
      setPopularCoffees(coffees.map(coffee => ({
        ...coffee,
        type: 'coffee',
        imageUrl: coffee.image_url
      })));

      // Load good cafes
      const { data: cafes, error: cafesError } = await supabase
        .from('profiles')
        .select('*')
        .in('account_type', ['cafe', 'roaster'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (cafesError) throw cafesError;
      console.log('Raw cafes data:', cafes);

      if (!cafes || cafes.length === 0) {
        console.log('Using mock cafe data');
        const mockCafes = [
          {
            id: 'vertigo-cafe',
            type: 'cafe',
            name: 'Vértigo y Calambre',
            full_name: 'Vértigo y Calambre',
            location: 'Murcia',
            avatar_url: require('../../assets/businesses/vertigo-logo.jpg'),
            cover_url: require('../../assets/businesses/vertigo-cover.jpg'),
            rating: 4.8,
            review_count: 42,
            is_open: true,
            account_type: 'cafe'
          },
          {
            id: 'cafelab-cafe',
            type: 'cafe',
            name: 'CaféLab Murcia',
            full_name: 'CaféLab Murcia',
            location: 'Murcia',
            avatar_url: require('../../assets/businesses/cafelab-logo.png'),
            cover_url: require('../../assets/businesses/cafelab-murcia-cover.png'),
            rating: 4.7,
            review_count: 38,
            is_open: true,
            account_type: 'cafe'
          }
        ];
        setGoodCafes(mockCafes);
      } else {
        setGoodCafes(cafes.map(cafe => ({
          ...cafe,
          type: 'cafe',
          name: cafe.full_name,
          imageUrl: cafe.avatar_url,
          logo_url: cafe.avatar_url,
          cover_url: cafe.cover_url || cafe.avatar_url,
          rating: cafe.rating || 4.5,
          review_count: cafe.review_count || 0,
          is_open: true
        })));
      }

      // Load popular gear from Supabase
      try {
        const { data: gear, error: gearError } = await supabase
          .from('gear')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        if (gearError) {
          console.error('Error loading gear:', gearError);
        } else {
          console.log('Loaded gear from Supabase:', gear);
          
          setPopularGear(gear ? gear.map(item => {
            console.log(`Processing gear item ${item.id}, image_url:`, item.image_url);
            
            const { data: { publicUrl } } = supabase.storage
              .from('gear')
              .getPublicUrl(`${item.id}.jpg`);
            
            return {
              ...item,
              type: 'gear',
              imageUrl: publicUrl || 
                'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=2940&auto=format&fit=crop',
              name: item.name || '',
              brand: item.brand || '',
              category: item.category || '',
              description: item.description || '',
              price: item.price || 0
            };
          }) : []);
        }
      } catch (error) {
        console.error('Error loading gear:', error);
        setPopularGear([]);
      }

      // Load suggested users
      try {
        // Get current user session to exclude them from suggestions
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;
        
        let query = supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, location, account_type')
          .eq('account_type', 'user')
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Only add the neq filter if we have a valid user ID
        if (currentUserId) {
          query = query.neq('id', currentUserId);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) throw usersError;
        
        console.log('Loaded users:', users);
        setSuggestedUsers(users ? users.map(user => ({
          ...user,
          id: user.id,
          type: 'user',
          userName: user.full_name || user.username,
          username: user.username,
          userAvatar: user.avatar_url,
          location: user.location
        })) : []);
      } catch (error) {
        console.error('Error loading suggested users:', error);
        setSuggestedUsers([]);
      }

      // Load popular recipes
      try {
        const { data: recipes, error: recipesError } = await supabase
          .from('recipes')
          .select(`
            *,
            author:author_id(full_name, avatar_url),
            coffee:coffee_id(name, roaster)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recipesError) throw recipesError;
        
        setPopularRecipes(recipes ? recipes.map(recipe => ({
          id: recipe.id,
          name: recipe.title,
          type: 'recipe',
          method: recipe.method,
          creatorName: recipe.author?.full_name,
          creatorAvatar: recipe.author?.avatar_url,
          coffeeName: recipe.coffee?.name,
          roaster: recipe.coffee?.roaster,
          imageUrl: recipe.image_url
        })) : []);
      } catch (error) {
        console.error('Error loading recipes:', error);
        setPopularRecipes([]);
      }

      setIsSearchDataLoaded(true);
      console.log('SearchDataContext: Search data loaded successfully');
      
    } catch (error) {
      console.error('Error loading search data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isSearchDataLoaded]);

  const refreshSearchData = useCallback(async () => {
    setIsSearchDataLoaded(false);
    setIsLoading(true);
    await loadSearchData();
  }, [loadSearchData]);

  // Auto-load search data when the provider mounts
  useEffect(() => {
    loadSearchData();
  }, [loadSearchData]);

  return (
    <SearchDataContext.Provider value={{
      popularCoffees,
      goodCafes,
      popularGear,
      suggestedUsers,
      popularRecipes,
      isSearchDataLoaded,
      isLoading,
      loadSearchData,
      refreshSearchData,
    }}>
      {children}
    </SearchDataContext.Provider>
  );
};

export const useSearchData = () => {
  const context = useContext(SearchDataContext);
  if (!context) {
    throw new Error('useSearchData must be used within a SearchDataProvider');
  }
  return context;
};