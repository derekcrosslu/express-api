const express = require("express");
const axios = require("axios");

const app = express();
const apiKey = process.env.apiKey;

const axiosInstance = axios.create({
  baseURL: "https://api.fillout.com",
  headers: { Authorization: `Bearer ${apiKey}` },
  decompress: false,
});

app.get("/:formId/filteredResponses", async (req, res) => {
  try {
    const { formId } = req.params;
    const { filters: filtersString, ...queryParams } = req.query;
    const filters = JSON.parse(filtersString);

    const response = await axiosInstance.get(
      `/v1/api/forms/${formId}`,
      // `/v1/api/forms/${formId}/submissions`, -> no response
      // `/v1/api/forms/${formId}`,  no response either
      {
        params: queryParams,
      }
    );

    const { totalResponses = 0, pageCount = 0 } = response.data;
    const responses = response.data.responses || [];

    console.log("response.data: ", response.data);

    const filteredResponses = responses.filter((response) => {
      return filters.every((filter) => {
        const question = response.questions.find((q) => q.id === filter.id);
        if (!question) return false;

        switch (filter.condition) {
          case "equals":
            return question.value === filter.value;
          case "does_not_equal":
            return question.value !== filter.value;
          case "greater_than":
            return new Date(question.value) > new Date(filter.value);
          case "less_than":
            return new Date(question.value) < new Date(filter.value);
          default:
            return false;
        }
      });
    });

    res.json({
      responses: filteredResponses,
      totalResponses: filteredResponses.length,
      pageCount: Math.ceil(filteredResponses.length / queryParams.pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
