import React from 'react';
import GameComponent from './components/GameComponent';

function App() {
  return (
      <div className="App">
          <header className="App-header">
              {/* Header content like logo, navigation, etc., if applicable */}
          </header>
          
          <main>
              <GameComponent />
              {/* You can add more components here as your app grows */}
          </main>

          <footer>
              {/* Footer content, if needed */}
          </footer>
      </div>
  );
}

export default App;
