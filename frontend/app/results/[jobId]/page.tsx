export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  return (
    <div style={{ padding: 40 }}>
      <h1>Results Page Works</h1>

      <p>Job ID: {jobId}</p>
    </div>
  );
}