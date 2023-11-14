import React from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
//A revoir
export default function RestrictionTable({ restrictions }) {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Restrictions Table">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Autres Colonnes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {restrictions.map((restriction) => (
            <TableRow key={restriction.id}>
              <TableCell>{restriction.id}</TableCell>
              <TableCell>{/* Other columns' data */}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
