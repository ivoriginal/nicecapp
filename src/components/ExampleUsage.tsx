import React, { useState, useEffect } from 'react';
import { 
  getCoffeeById, 
  getRecipesByCoffeeId, 
  getCoffeeSellers,
  Coffee,
  Recipe,
  Seller
} from '../data';

interface ExampleUsageProps {
  coffeeId: string;
}

const ExampleUsage: React.FC<ExampleUsageProps> = ({ coffeeId }) => {
  const [coffee, setCoffee] = useState<Coffee | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use the data service functions to fetch data
        const coffeeData = await getCoffeeById(coffeeId);
        
        if (!coffeeData) {
          setError(`Coffee with ID ${coffeeId} not found`);
          setLoading(false);
          return;
        }

        // Get associated data
        const recipesData = await getRecipesByCoffeeId(coffeeId);
        const sellersData = await getCoffeeSellers(coffeeId);

        // Update state
        setCoffee(coffeeData);
        setRecipes(recipesData);
        setSellers(sellersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching coffee data:', err);
        setError('Failed to load coffee data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [coffeeId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!coffee) {
    return <div>Coffee not found</div>;
  }

  return (
    <div className="coffee-detail">
      <h1>{coffee.name}</h1>
      <div className="coffee-info">
        <img src={coffee.image} alt={coffee.name} width={300} />
        <div>
          <p><strong>Origin:</strong> {coffee.origin}</p>
          <p><strong>Region:</strong> {coffee.region}</p>
          <p><strong>Roaster:</strong> {coffee.roaster}</p>
          <p><strong>Process:</strong> {coffee.process}</p>
          <p><strong>Varietal:</strong> {coffee.varietal}</p>
          <p><strong>Profile:</strong> {coffee.profile}</p>
          <p><strong>Price:</strong> €{coffee.price}</p>
        </div>
      </div>

      {sellers.length > 0 && (
        <div className="sellers-section">
          <h2>Available from:</h2>
          <ul>
            {sellers.map(seller => (
              <li key={seller.id}>
                <img src={seller.avatar} alt={seller.name} width={40} height={40} style={{ borderRadius: '50%' }} />
                <span>{seller.name} - {seller.location}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipes.length > 0 && (
        <div className="recipes-section">
          <h2>Brew Recipes:</h2>
          <div className="recipes-list">
            {recipes.map(recipe => (
              <div key={recipe.id} className="recipe-card">
                <h3>{recipe.name}</h3>
                <p>By: {recipe.creatorName}</p>
                <p>Method: {recipe.brewingMethod}</p>
                <p>Grind: {recipe.grindSize}</p>
                <p>{recipe.coffeeAmount}g coffee : {recipe.waterAmount}g water</p>
                <p>Brew time: {recipe.brewTime}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="description-section">
        <h2>About this coffee</h2>
        <p>{coffee.description}</p>
      </div>
    </div>
  );
};

export default ExampleUsage; 