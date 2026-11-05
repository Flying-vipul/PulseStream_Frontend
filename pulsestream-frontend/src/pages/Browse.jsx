// Example logic for your Browse page
const actionMovies = allMovies.filter(movie => movie.genre === 'ACTION');
const scifiMovies = allMovies.filter(movie => movie.genre === 'SCI_FI');

return (
  <div>
      <HeroBillboard />
      <MovieRow title="Explosive Action" movies={actionMovies} />
      <MovieRow title="Sci-Fi Masterpieces" movies={scifiMovies} />
  </div>
);