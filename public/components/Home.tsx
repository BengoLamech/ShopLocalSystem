import React from 'react'
import Login from './Login'



const Home = () => {
  const handleLoginSuccess = () => {
    // Handle successful login here, like navigating to the home page
    console.log('Login successful!');
  };
  return (
    <div className='home'>
       <section className="header">
          <h1>Welcome to ShopLocal Sales System</h1>
       </section>
      <section className='login-body'>
        <Login onLoginSuccess={handleLoginSuccess} />
      </section>
      
    </div>
  )
}

export default Home