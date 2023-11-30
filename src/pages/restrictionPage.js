import React from 'react';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import { useState, useEffect } from 'react';
import RestrictionTable2 from '../components/restrictions/restrictionTable2';
import RestrictionForm from '../components/restrictions/restrictionForm';
import AddButton from '../components/shared/addButton';

export default function RestrictionPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);

  const changeData = (newData) => {
    console.log('newData reçue de restrictionForm :', newData);
    setData(newData);
  };
  // const fetchData = async () => {
  //   try {
  //     const response = await axios.get('http://localhost:8085/v1/restrictions/', {
  //       headers: { Accept: 'application/json' }
  //     });
  //     setData(response.data);
  //     console.log(response);
  //   } catch (error) {
  //     console.error('Erreur lors de la requête GET :', error);
  //   }
  // };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8085/v1/restrictions/', {
        headers: { Accept: 'application/json' }
      });
      setData(response.data);
      console.log(response);
    } catch (error) {
      console.error('Erreur lors de la requête GET :', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Grid container spacing={2}>
      <Grid>
        <Grid item xs={12}>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <RestrictionTable2 data={data} setNewData={changeData} />
            </Grid>
          </Grid>
        </Grid>
        <AddButton
          pageType={<RestrictionForm close={setOpen} setNewData={changeData}></RestrictionForm>}
          setOpen={setOpen}
          status={open}
          graphqlErrors={null}
        ></AddButton>
      </Grid>
    </Grid>
  );
}
