# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Insights Page CSV Export Functionality

The Insights page (`src/pages/Insights.tsx`) includes functionality to export the data behind several charts as CSV files. This is useful for offline analysis or sharing.

### Implementation Details

*   **Utility Function:** A generic CSV export function, `downloadCSV`, is located in `src/utils/exportUtils.ts`. This function takes an array of data objects and a filename, converts the data to CSV format (handling headers and basic escaping), and triggers a browser download.
*   **Integration:**
    *   In `src/pages/Insights.tsx`, the `downloadCSV` function is imported.
    *   "Export CSV" buttons are added to the header section of each relevant chart container (Spending Trends, Category Spending, Repayment Performance, Monthly Breakdown).
    *   Each button's `onClick` handler calls `downloadCSV`, passing the corresponding data state variable (e.g., `aggregatedSpendingData`, `categoryData`, `aggregatedRepaymentData`, `monthlyBreakdown`) and a dynamically generated filename.
    *   The `SpendingComparisonChart` component (`src/components/SpendingComparisonChart.tsx`) also imports `downloadCSV` and includes its own "Export CSV" button, exporting its `combinedData` state.
*   **Data Source:** Currently, the exported data is based on the *fake data* generated within the components for demonstration purposes.

### Future Integration with Real Data

When connecting to a real backend API:

1.  **Replace Fake Data:** Update the state variables (e.g., `aggregatedSpendingData`, `categoryData`, etc.) to be populated with data fetched from your API instead of the fake data generation logic.
2.  **Ensure Data Structure:** The `downloadCSV` utility expects an array of objects. Ensure the data fetched from the API is transformed into this structure if necessary before being passed to the export function.
3.  **No Change to Export Logic:** The `downloadCSV` function itself and the button integration should not require changes, as long as the data passed to it maintains the expected format (array of objects).
