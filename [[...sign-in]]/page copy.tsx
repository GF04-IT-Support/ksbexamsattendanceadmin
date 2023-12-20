import { SignIn } from "@clerk/nextjs";

const Signin = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            footer: {
              display: "none",
            },
            header: {
              justifyContent: "center",
              textAlign: "center",
            },
            headerSubtitle: {
              display: "none",
            },
            headerTitle: {
              fontSize: "1.5rem",
              fontWeight: "bold",
              textTransform: "uppercase",
            },
            form: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
            },
          },
        }}
      />
    </div>
  );
};

export default Signin;
