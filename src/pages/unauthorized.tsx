const Unauthorized = () => {
  const LockImage = "../assets/images/lock.png";

  return (
    <div>
      <div>
        <img src={LockImage} />
        <header>
          Unauthorized
        </header>
      </div>
    </div>
  );
};

export default Unauthorized;
