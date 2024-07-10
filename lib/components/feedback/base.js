export default class Feedback {
    constructor(data) {
        this.rating = data.rating;
        this.language = data.language;
        this.reason = data.reason;
        this.session = data.session;
    }
}
