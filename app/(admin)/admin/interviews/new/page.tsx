import { getCurrentUser } from "@/lib/actions/auth.action";
import NewInterviewClient from "./NewInterviewClient";

const NewInterviewPage = async () => {
  const user = await getCurrentUser();
  return <NewInterviewClient userId={user?.id ?? ""} userName={user?.name ?? ""} />;
};

export default NewInterviewPage;
