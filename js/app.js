// references to HTML elements
const courseInformationSection = document.getElementById("courseInformation");
const courseSearchButton = document.getElementById("searchBtn");
const courseSearchInput = document.getElementById("courseSearch");

/**
 * Initialize the UI components.
 */
(async function initUI() {
    // search for course data on search button click
    courseSearchButton.onclick = getCourseData;

    // search for course data on Enter button press
    courseSearchInput.onkeyup = e => {
        if (e.key == "Enter") 
        {
            getCourseData();
        }
    }

    // listen for changes in the course search input
    courseSearchInput.oninput = e => {
        // clear course information if the search input becomes blank (like if they clear the search)
        if (e.target.value == "")
        {
            courseInformation.innerHTML = "";
        }
    }
})();

/**
 * Search for course data from the Gritview API.
 */
function getCourseData() {
    let query = document.getElementById("courseSearch").value;
    query = query.split(" ").join("");

    fetch(`https://api.gritview.io/course?course=${query}`)
        .then(response => response.json())
        .then(showCourseInformation)
        .catch(showSearchErrorMessage);
}

/**
 * Show an error message that the search query did not return any data.
 */
function showSearchErrorMessage() {
    // clear out previous course information (if any)
    courseInformation.innerHTML = "";

    createElement(courseInformation, "h3", {
        text: "An error occured"
    });

    createElement(courseInformation, "p", {
        text: "We are sorry to say that your search has failed. Please check your search terms and try again."
    });

    createElement(courseInformation, "p", {
        text: "The surefire way to find a match is to do the department code in ALL CAPS followed by the number."
    });

    createElement(courseInformation, "p", {
        text: "Ex: CMSC411"
    });
}

/**
 * Get the offerning information about a course (latest offerings, instructors, etc).
 * @param {Object} course 
 */
function showCourseInformation(course) {
    // if the course query was well-formed, but replied back with no data
    if (!Object.keys(course.subject).length) 
    {
        showSearchErrorMessage();

        return;
    }

    // clear out previous course information (if any)
    courseInformation.innerHTML = "";

    // destructure name information from subject sub-object and put together course name
    const { name, catalog_number, description } = course.subject;
    const courseName = `${name} ${catalog_number} - ${description}`;

    // create a header showing the course name
    createElement(courseInformation, "h3", { text: courseName });

    // create a card grid for the semester cards
    const cardContainer = createElement(courseInformation, "div", { 
        class: "row row-cols-1 row-cols-md-2"
    });

    // go through each type of semester to show the latest offering
    [ "Fall", "Spring", "Winter", "Summer" ]
        .forEach(semester => {
            // get the latest semesterly offering
            const lastSemesterlyOffering = course.semesters.find(x => x.includes(semester));

            // create a card for the semester
            const card = createElement(cardContainer, "div", { 
                class: "card"
            });

            // create a card body to hold everything
            const cardBody = createElement(card, "div", {
                class: "card-body"
            });

            // create a card title that says the semester
            createElement(cardBody, "h5", {
                class: "card-title",
                text: semester
            });

            // add the date the course was offered during that semester type
            createElement(cardBody, "p", {
                class: "mb-0",
                innerHTML: `<b>Last Offered</b>: ${lastSemesterlyOffering || "N/A"}`
            });

            let probability = 0.50;

            // if the course was offered last year for that semester
            if (lastSemesterlyOffering)
            {
                const [ type, year ] = lastSemesterlyOffering.split(" ");

                if (new Date().getFullYear() - year <= 1)
                {
                    probability += 0.20
                }

                // TODO this is a recency bias, take account of gaps before last semester (this will help on biannuals)
            }
            // if the course was not offered last year for that semester
            else
            {
                probability -= 0.20;
            }

            // choose the badge text depending on probability levels
            let text = "";
            if (probability >= 0.70)
            {
                text = "Hightly Likely";
            }
            else if (probability > 0.50)
            {
                text = "Likely";
            }
            else if (probability <= 0.30)
            {
                text = "Highly Unlikely";
            }
            else
            {
                text = "Unlikely";
            }

            // add the paragraph describing future likelihood
            const likelihoodP = createElement(cardBody, "p", {
                class: "fw-bold",
                text: "Likelihood of Future Offering: "
            })

            // create a badge to house likelihood text and be colored
            const likelihoodBagdge = createElement(likelihoodP, "span", {
                class: "badge",
                text: text
            });

            // linear interpolate color between red and green
            likelihoodBagdge.style.background = lerpColor("#FF0000", "#00FF00", probability);
        });

    // create an instructor lookup table by instructor id
    const instructors = {};
    course.instructors.forEach(x => {
        instructors[x.id] = `${x.first_name} ${x.last_name}`;
    });

    // create list header
    createElement(courseInformation, "b", { text: "All Offerings:" });

    // get sections by semester
    const sectionsBySemester = getSectionsBySemester(course);

    // create a list showing all semesters and sections offered
    const semesterList = createElement(courseInformation, "ul");

    // for each semester show the section information
    Object.entries(sectionsBySemester)
        .reverse()
        .forEach(([ semester, sections ]) => {
            // create a list item saying what semester this is
            createElement(semesterList, "li", { text: semester });

            // create a list of the sections for the semester
            const sectionList = createElement(semesterList, "ul");

            // add to the sub-list each section
            sections
                .forEach(x => {
                    createElement(sectionList, "li", {
                        text: `${instructors[x.instructor_id]} (${x.total_enrolled} students enrolled)`
                    });
                });
        });
}

/**
 * Linearly interpolate a color between two values by a given amount.
 * 
 * From: https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
 * 
 * @param {String} a 
 * @param {String} b 
 * @param {Number} amount 
 * @returns {String} color
 */
function lerpColor(a, b, amount) {
    let ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);

    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}

/**
 * 
 * @param {Object} course 
 * @returns {Object} sectionsBySemester
 */
function getSectionsBySemester(course) {
    // deep copy course enrollment and grades
    const enrollment = JSON.parse(JSON.stringify(course.enrollment)).reverse();
    const grades = JSON.parse(JSON.stringify(course.grades));

    // this approach could potentially create incorrect groupings?
    const semesters = {};
    enrollment
        .forEach(([ semester, totalStudents ]) => {
            semesters[semester] = [];

            let numStudents = 0;
            while (numStudents < totalStudents) {
                const section = grades.shift();

                // sometimes there are blank arrays in the grades list, idk why
                if (section && section.length != 0)
                {
                    semesters[semester].push(section);
            
                    numStudents += section.total_enrolled;
                }
            }
        });

    return semesters;
}

/**
 * Create an HTML element and add it to the DOM tree.
 * @param {HTMLElement} parent 
 * @param {String} tag 
 * @param {Object} attributes 
 */
function createElement(parent, tag, attributes = {}) {
    // create the element to whatever tag was given
    const el = document.createElement(tag);

    // go through all the attributes in the object that was given
    Object.entries(attributes)
        .forEach(([attr, value]) => {
            // handle the various special cases that will cause the Element to be malformed
            if (attr == "innerText") {
                el.innerText = value;
            }
            else if (attr == "innerHTML") {
                el.innerHTML = value;
            }
            else if (attr == "textContent" || attr == "text") {
                el.textContent = value;
            }
            else if (attr == "onclick") {
                el.onclick = value;
            }
            else if (attr == "onkeydown") {
                el.onkeydown = value;
            }
            else {
                el.setAttribute(attr, value);
            }
        });

    // add the newly created element to its parent
    parent.appendChild(el);

    // return the element in case this element is a parent for later element creation
    return el;
}