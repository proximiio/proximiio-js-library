const compareResults = (pois, visionTextResults) => {
    // Loop through each store
    pois.forEach((poi) => {
        let totalScore = 0;
        // Loop through each word in OCR results
        visionTextResults.forEach((ocrWord) => {
            const containsWordScore = containsWordFromTitle(ocrWord, poi.properties.title);
            // Calculate similarity score between store title and OCR word
            const similarityScore = calculateSimilarity(poi.properties.title, ocrWord);
            // Update the total score for the current store
            totalScore += containsWordScore > 0 ? similarityScore : 0;
            // Check if the OCR word contains at least one word from the shop title and raise score based on it
            totalScore += containsWordScore;
        });
        // Assign the total score to the store object
        poi.score = totalScore;
    });
    return pois;
};
const containsWordFromTitle = (text, title) => {
    let score = 0;
    // Convert strings to lowercase for case-insensitive comparison
    const lowercaseText = text.toLowerCase();
    const lowercaseTitle = title.toLowerCase();
    // Split the title into words
    const titleWords = lowercaseTitle.split(' ');
    // Check if any word from the title is present in the text
    if (titleWords.some((word) => lowercaseText.includes(word))) {
        score += 0.5;
    }
    if (titleWords.some((word) => lowercaseText === word)) {
        score += 1;
    }
    return score;
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
    // Convert strings to lowercase for case-insensitive comparison
    const set1 = new Set(str1.toLowerCase().split(''));
    const set2 = new Set(str2.toLowerCase().split(''));
    // Calculate Jaccard similarity
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size + similarity;
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
