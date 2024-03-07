const compareResults = (pois, visionTextResults) => {
    // Loop through each store
    pois.forEach((poi) => {
        let totalScore = 0;
        // Loop through each word in OCR results
        visionTextResults.forEach((ocrWord) => {
            // Calculate similarity score between store title and OCR word
            const similarityScore = calculateSimilarity(poi.properties.title, ocrWord);
            // Update the total score for the current store
            totalScore += similarityScore;
        });
        // Assign the total score to the store object
        poi.score = totalScore / visionTextResults.length; // Normalize the score
    });
    return pois;
};
const calculateSimilarity = (str1, str2) => {
    // Convert strings to lowercase for case-insensitive comparison
    const lowerStr1 = str1.toLowerCase();
    const lowerStr2 = str2.toLowerCase();
    // Calculate the similarity using Levenshtein Distance
    // You can use any other algorithm like Jaccard similarity, Cosine similarity, etc.
    // Here, Levenshtein Distance is used for simplicity
    const distance = levenshteinDistance(lowerStr1, lowerStr2);
    // Max possible similarity score is the length of the longer string
    const maxLength = Math.max(lowerStr1.length, lowerStr2.length);
    // Normalize the similarity score between 0 and 1
    const similarity = 1 - distance / maxLength;
    return similarity;
};
// Function to calculate Levenshtein Distance between two strings
const levenshteinDistance = (str1, str2) => {
    const dp = Array.from(Array(str1.length + 1), () => Array(str2.length + 1).fill(0));
    for (let i = 0; i <= str1.length; i++) {
        for (let j = 0; j <= str2.length; j++) {
            if (i === 0) {
                dp[i][j] = j;
            }
            else if (j === 0) {
                dp[i][j] = i;
            }
            else {
                dp[i][j] =
                    str1[i - 1] === str2[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }
    return dp[str1.length][str2.length];
};
export { compareResults };
