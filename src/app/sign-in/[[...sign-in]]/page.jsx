import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div style={{ marginTop: "100px", display: "flex", justifyContent: "center" }}>
            <SignIn />
        </div>
    );
}
