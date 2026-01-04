
const AppError = ({ error }: any) => {
  const Error = "../../assets/images/error.png";
  return (
    <div>
      <div>
        <img src={Error} />
      </div>

      <text>Application error</text>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
};

export default AppError;
