---
title: "How to track expenses in a spreadsheet (Excel or Google Sheets)"
description: "A column layout to copy, SUMIFS formulas for monthly and category totals, CSV import steps, and how to tie every row to its receipt."
cluster: "core:expense-spreadsheet-export"
---

A spreadsheet is a perfectly good expense log. For federal tax purposes the IRS says you
[may choose any recordkeeping system suited to your business that clearly shows your income and expenses](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep),
and a sheet with one row per expense meets that description. What it needs is a fixed set of columns, a few formulas
that do the adding for you, and a reliable way to get from any row back to the receipt behind it.

This guide gives you all three. Everything below works the same way in Microsoft Excel and Google Sheets.

## The column layout

Use one workbook per tax year and one sheet for the log. Put these headers in row 1, starting in column A, and add one
row per expense:

| Date | Merchant | Description | Category | Amount | Paid with | Receipt file | Month |
|---|---|---|---|---|---|---|---|
| 1/8/2026 | Corner Print Co. | 500 business cards | Advertising | 64.20 | Visa ending 4821 | 2026-01-08_corner-print_64.20.jpg | 1 |
| 1/22/2026 | Harbor Office Supply | Printer paper and toner | Supplies | 118.45 | Debit ending 0937 | 2026-01-22_harbor-office_118.45.jpg | 1 |
| 2/11/2026 | Regional Rail | Round trip to client meeting | Travel | 46.00 | Cash | 2026-02-11_regional-rail_46.00.jpg | 2 |

That puts Date in column A, Category in D, Amount in E, Receipt file in G and Month in H. The formulas later in this
guide use those letters.

### Why these columns

The IRS page on records lists what the supporting documents for a business expense should show:
[the payee, the amount paid, proof of payment, the date incurred, and a description](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep)
of what was bought that shows it was for the business. The columns mirror that list:

- **Date** and **Merchant** (the payee) come straight off the receipt.
- **Description** is the business reason in your own words: "500 business cards", not "Corner Print".
- **Amount** is the total you paid. Type it as a plain number, without a currency sign, so the formulas can add it.
- **Paid with** points to proof of payment. The IRS page notes that
  [a combination of supporting documents may be needed](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep),
  such as a receipt plus the card statement it appears on. Naming the card (last four digits only) tells you which
  statement to pull.
- **Category** is for totals. Use a short, fixed list and spell each name the same way every time, because the
  formulas match the text exactly. Which categories make sense for a Schedule C or another return is covered in
  [the self-employed expense tracking guide](/guides/self-employed-expense-tracking/).
- **Receipt file** links the row to its receipt (more on this below).
- **Month** is a helper column that a formula fills in.

### The Month column

In H2, enter:

```
=MONTH(A2)
```

then fill it down the column. Both
[Excel's MONTH function](https://support.microsoft.com/en-us/office/month-function-579a2881-199b-48b2-ab90-ddba0eba86e8)
and [Google Sheets' MONTH function](https://support.google.com/docs/answer/3093052?hl=en) take one argument, the date,
and return the month as a number; Microsoft's page states the range as 1 (January) to 12 (December). Because each
workbook holds one tax year, a month number is all you need to group rows.

## Formulas for monthly and category totals

The function that does the work is SUMIFS. Microsoft and Google document the same argument order:

- **Excel:** [`SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)`](https://support.microsoft.com/en-us/office/sumifs-function-c9e748f5-7ea7-455d-9406-611cebce642b)
- **Google Sheets:** [`SUMIFS(sum_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])`](https://support.google.com/docs/answer/3238496?hl=en)

In words: first the column you want added, then pairs of "which column to check" and "what to look for". Only rows that
meet every condition are added.

Put the totals to the right of the log, for example in columns K and L. The ranges below run to row 1000; extend them if
your year has more rows.

### Monthly totals

Type the numbers 1 to 12 in K2:K13. In L2, enter:

```
=SUMIFS($E$2:$E$1000, $H$2:$H$1000, K2)
```

and fill it down to L13. The `$` signs make the two ranges
[absolute references](https://support.microsoft.com/en-us/office/switch-between-relative-absolute-and-mixed-references-dfec08cd-ae65-4f56-839e-5f0d8d0baca9),
so they stay the same as you copy the formula down, while the plain K2 changes to K3, K4 and so on. With the three
example rows, L2 (January) shows 182.65 and L3 (February) shows 46.00.

### Totals by category

Type your category names in K16 downward (Advertising, Supplies, Travel, and the rest of your list). In L16, enter:

```
=SUMIFS($E$2:$E$1000, $D$2:$D$1000, K16)
```

and fill it down. Microsoft's page lists a cell reference as a valid criterion, so the formula reads the category name
from column K. With the example rows, Supplies shows 118.45.

If you prefer to type the category into the formula, put it in quotation marks: `=SUMIFS($E$2:$E$1000, $D$2:$D$1000, "Supplies")`.
Microsoft's troubleshooting note for a result of 0 is to
[make sure text criteria are in quotation marks](https://support.microsoft.com/en-us/office/sumifs-function-c9e748f5-7ea7-455d-9406-611cebce642b).

### One month and one category

Add a second pair to combine conditions. Advertising in January:

```
=SUMIFS($E$2:$E$1000, $H$2:$H$1000, 1, $D$2:$D$1000, "Advertising")
```

With the example rows, this returns 64.20. Excel accepts
[up to 127 range/criteria pairs](https://support.microsoft.com/en-us/office/sumifs-function-c9e748f5-7ea7-455d-9406-611cebce642b),
far more than an expense log needs.

### Three mistakes to avoid

- **Argument order borrowed from SUMIF.** Microsoft points out that
  [sum_range is the first argument in SUMIFS but the third in SUMIF](https://support.microsoft.com/en-us/office/sumifs-function-c9e748f5-7ea7-455d-9406-611cebce642b),
  and calls this a common source of problems. If you copy a SUMIF formula and turn it into SUMIFS, move the Amount range
  to the front.
- **Ranges of different sizes.** Each criteria range must have the same number of rows and columns as the sum range.
  `$E$2:$E$1000` with `$D$2:$D$500` is a bug.
- **Dates stored as text.** Microsoft's MONTH page warns that
  [problems can occur if dates are entered as text](https://support.microsoft.com/en-us/office/month-function-579a2881-199b-48b2-ab90-ddba0eba86e8).
  If the Month column shows an error or a month that does not match the date, fix the date column first. This happens
  most often after importing a file, which is the next section.

## Importing a CSV file

If your expenses come from an app export or a bank download, they usually arrive as a CSV file: plain text with one
row per line and the fields separated by commas.

### Excel

Microsoft's page on [importing text and CSV files](https://support.microsoft.com/en-us/office/import-or-export-text-txt-or-csv-files-5250ac4c-663c-47ce-937b-339e391393ba)
describes two routes:

1. **Open it.** Go to **File > Open**, choose **Text Files** in the file type list, and double-click the file. A .csv
   file opens directly in a new workbook.
2. **Import into an existing sheet.** Click the cell where the data should start. On the **Data** tab, in the
   **Get & Transform Data** group, click **From Text/CSV**, double-click the file and click **Import**. In the preview,
   choose **Load**, **Load To**, or **Transform Data** if you want to edit the data in Power Query first. You can also
   pick the delimiter there and see the effect in the preview.

Two points from the same page matter for an expense log. When Excel opens a .csv file directly, it uses your default
data format settings to read each column; Microsoft's example is a file whose dates are month-day-year opened on a
system that expects year-month-day. The From Text/CSV route gives you more control. And when you save, a CSV keeps only
the current worksheet, and Excel warns that features text formats do not support may be lost. Once you have added the Month column and the
totals, save the file as an Excel workbook.

### Google Sheets

Google's page on [importing data sets](https://support.google.com/docs/answer/40608?hl=en) gives these steps on a
computer:

1. Open or create a spreadsheet in Google Sheets.
2. At the top, click **File > Import**.
3. Choose the file. .csv is one of the supported types.
4. Pick an import option. **Create new spreadsheet** is the cleanest choice for a new tax year. **Append rows to current
   sheet** adds the data after the last row that has any data, so use it only when the file's columns match your log in
   the same order, and delete the repeated header row afterward.
5. Under **Separator character**, leave **Detect automatically** or choose **Comma**.
6. Click **Import**.

### After the import

Check three things before you trust any total: the dates line up with the months in column H, the Amount column holds
numbers rather than text, and the row count matches the number of receipts you expected.

## Linking each row to its receipt

A row is a summary. The receipt is the evidence. The IRS describes supporting documents as the papers that
[support the entries in your books and on your tax return](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep),
and the Receipt file column is how you get from one to the other. Two schemes work:

- **Filename.** Save each receipt image as date, merchant and amount, for example
  `2026-01-08_corner-print_64.20.jpg`, in one folder per tax year. Starting with the date in year-month-day order makes
  the folder sort chronologically, and the amount in the name lets you spot a mismatch without opening the file.
- **ID.** Number receipts in sequence (R-0001, R-0002), write the number on paper receipts, and name the image the same.
  The ID is shorter to type and still unique when two receipts share a date and a merchant.

Pick one scheme and keep it for the whole year. The IRS page suggests keeping supporting documents
[organized by year and type of income or expense](https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep);
a folder per tax year with filenames that match the rows does that. For filing the images themselves, see
[how to organize receipts](/guides/how-to-organize-receipts/).

## What a spreadsheet does not do on its own

- **It does not keep the receipt.** The sheet holds what you typed. The image, or the paper, has to be stored
  somewhere else, and that copy is what supports the entry.
- **It does not notice a missing receipt.** A filename in column G is only text; the sheet will not tell you if the
  file was never saved or was deleted.
- **It does not check your typing.** A transposed amount, or a category typed as "Supplies" in one row and
  "Supplise" in another, gives wrong totals without any warning.
- **It does not decide what counts.** Whether an expense is deductible, and which receipts you need to keep, are tax
  questions. [Which receipts to keep for taxes](/guides/which-receipts-to-keep-for-taxes/) covers them.

## A monthly check

Once a month, after entering the last receipt:

- Every row has a Receipt file entry, and that file exists in the year's folder.
- Every image in the folder for that month has a row.
- The category total list in column K contains every category used in column D (a misspelled category is missing from
  the totals).
- The card rows for the month add up to the business charges on that card's statement.
- The Month column has no errors.

## Using Taxfold with a spreadsheet

Taxfold, the iPhone app we make, keeps receipts on the phone filed by tax year and exports a year as a CSV file
through the iPhone share sheet. That file opens in Excel or Google Sheets with the steps above, and the receipt photos
stay in the app. Taxfold is in development and not yet on the App Store.
