# Vercel Deployment

This repository is deployed as two separate Vercel projects from the same repository.

## Prerequisites

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Have the Neon database connection string available.
3. Have two different generated password hashes available.
4. Have two different session secrets available.

## Create the private Blob store

1. Open the Vercel dashboard.
2. Select the team that owns the projects.
3. Open **Storage**.
4. Select **Create Database** or **Create Store** and choose **Blob**.
5. Create one Blob store for the birthday project.
6. Open the store settings.
7. Confirm the store access mode is **Private**.
8. Copy the generated `BLOB_READ_WRITE_TOKEN` for use in both projects.

## Connect Neon Postgres

1. In the Vercel dashboard, open **Integrations** or **Marketplace**.
2. Search for **Neon**.
3. Select **Neon Postgres** and click **Add Integration**.
4. Create a database or connect the existing Neon database.
5. Choose both Vercel projects when the integration asks which projects should receive the connection.
6. Confirm that `DATABASE_URL` is available to both projects.

## Create the site project

1. Click **Add New...** and choose **Project**.
2. Import the repository.
3. Set the project name to the site project name, for example `birthday-site`.
4. Open **Configure Project**.
5. Set **Root Directory** to `apps/site`.
6. Enable **Include files outside the root directory**.
7. Keep the framework preset as **Next.js**.
8. Set the build command to `npm run build --workspace=apps/site` if Vercel does not detect it automatically.
9. Add these environment variables under **Settings > Environment Variables** for Production, Preview, and Development as appropriate:

   - `DATABASE_URL`: the Neon connection string
   - `BLOB_READ_WRITE_TOKEN`: the private Blob token
   - `VISITOR_PASSWORD_HASH`: the visitor password hash
   - `VISITOR_SESSION_SECRET`: the visitor session secret

10. Click **Deploy**.
11. After deployment, open **Deployments**, select the deployment, and confirm the build is ready.
12. After changing environment variables, open the latest deployment menu and click **Redeploy**.

## Create the editor project

1. Click **Add New...** and choose **Project**.
2. Import the same repository again.
3. Set the project name to the editor project name, for example `birthday-editor`.
4. Open **Configure Project**.
5. Set **Root Directory** to `apps/editor`.
6. Enable **Include files outside the root directory**.
7. Keep the framework preset as **Next.js**.
8. Set the build command to `npm run build --workspace=apps/editor` if Vercel does not detect it automatically.
9. Add these environment variables under **Settings > Environment Variables** for Production, Preview, and Development as appropriate:

   - `DATABASE_URL`: the same Neon connection string
   - `BLOB_READ_WRITE_TOKEN`: the same private Blob token
   - `EDITOR_PASSWORD_HASH`: the different editor password hash
   - `EDITOR_SESSION_SECRET`: the different editor session secret

10. Click **Deploy**.
11. After deployment, open **Deployments**, select the deployment, and confirm the build is ready.
12. After changing environment variables, open the latest deployment menu and click **Redeploy**.

## Final checks

1. Open the site project URL and confirm the visitor login works.
2. Open the editor project URL and confirm the editor login works.
3. Confirm the two passwords are different.
4. Confirm the two session secrets are different.
5. Confirm both projects use the same Neon database and private Blob store.
6. Run the gate script against the deployed URLs with the test environment variables.

## Not verified by this workspace session

- Vercel dashboard access and project creation
- Private Blob store creation and access mode
- Neon Marketplace provisioning
- Production environment-variable values
- Production deployment and redeployment
- DNS or custom-domain configuration
- Production database and Blob connectivity
- Real-device and iPhone Safari behavior
