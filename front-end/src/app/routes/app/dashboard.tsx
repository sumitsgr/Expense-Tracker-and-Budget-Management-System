import { ContentLayout } from "@/components/layouts";
import { useUser } from "@/lib/auth";
import { ROLES } from "@/lib/authorization";

const DashboardRoute = () => {
  const user = useUser();
  return (
    <ContentLayout title="Dashboard">
      <h1 className="text-xl">
        Welcome <b>{`${user.data?.name}`}</b>
      </h1>
      {`${user.data?.email}`}
    </ContentLayout>
  );
};

export default DashboardRoute;
