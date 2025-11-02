# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4734fa32-ab04-435b-8cf6-d46801e10e63

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4734fa32-ab04-435b-8cf6-d46801e10e63) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### GitHub Pages

To deploy to GitHub Pages (for example via the `npm run deploy` script) you **must** build the project with the GitHub Pages base path. This repository now includes a dedicated build command that sets the correct configuration automatically:

```sh
npm run build:github-pages
# or, when using the deploy script
npm run deploy
```

The generated `dist/` directory will use the `/Riksdag-Regering.AI/` base path so that the site loads correctly when served from `https://<username>.github.io/Riksdag-Regering.AI/` or any GitHub Pages custom domain mapping to the project.

### Custom domains / other hosts

For custom domains (e.g. `www.regeringskansliet.ai`, `www.riksdagen.ai`) or other hosting platforms, run the standard production build which keeps the site rooted at `/`:

```sh
npm run build
```

The resulting build folder can be uploaded to any static hosting provider. If you are using a provider-specific build target, such as Hostinger, continue to use the dedicated command:

```sh
npm run build:hostinger
```
